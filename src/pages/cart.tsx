"use client";
import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import ClientNavbar from "@/components/ClientNavbar";
import Footer from "@/components/Footer";
import { trpc } from "@/utils/trpc";

const toastStyles = {
    className: "bg-card text-foreground border border-border shadow-md",
    progressClassName: "bg-primary",
};

export default function CartPage() {
    const router = useRouter();
    const { status } = useSession();
    const utils = trpc.useUtils();
    const { data: cart } = trpc.cart.get.useQuery(undefined, {
        enabled: status === "authenticated",
    });
    const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const hasRedirectedRef = useRef(false);

    const update = trpc.cart.addOrUpdate.useMutation({
        onSuccess: () => utils.cart.get.invalidate(),
    });
    const remove = trpc.cart.remove.useMutation({
        onSuccess: () => utils.cart.get.invalidate(),
    });
    const clear = trpc.cart.clear.useMutation({
        onSuccess: () => utils.cart.get.invalidate(),
    });
    const mpesaPayment = trpc.mpesa.initiatePayment.useMutation({
        onSuccess: (response) => {
            utils.cart.get.invalidate();
            setCheckoutRequestId(response.CheckoutRequestID);
            setIsProcessingPayment(true);
            // Keep modal open to show processing state
            hasRedirectedRef.current = false;
            toast.info("Check your phone for the M-PESA prompt.", toastStyles);
        },
        onError: (error) => {
            setIsProcessingPayment(false);
            toast.error(error.message, toastStyles);
        },
    });

    const transactionStatus = trpc.mpesa.getTransactionStatus.useQuery(
        { checkoutRequestId: checkoutRequestId ?? "" },
        {
            enabled: Boolean(checkoutRequestId),
            refetchInterval: 4000,
            refetchOnWindowFocus: false,
        },
    );

    useEffect(() => {
        if (!transactionStatus.data || !checkoutRequestId) return;

        const { resultCode, resultDesc, orderStatus } = transactionStatus.data;
        if (resultCode === 0 && orderStatus === "PAID" && !hasRedirectedRef.current) {
            setIsProcessingPayment(false);
            setIsMpesaModalOpen(false);
            toast.success("Payment confirmed! Redirecting to orders…", toastStyles);
            hasRedirectedRef.current = true;
            // Small delay for user to see success message
            setTimeout(() => {
                router.push("/orders");
            }, 1500);
            return;
        }

        if (resultCode && resultCode !== 0) {
            setIsProcessingPayment(false);
            setIsMpesaModalOpen(false);
            toast.error(
                resultDesc ?? "Payment failed. Your items are still in the cart. Please try again.",
                { ...toastStyles, autoClose: 5000 }
            );
            hasRedirectedRef.current = true;
            setCheckoutRequestId(null);
            setPhoneNumber(""); // Clear phone for retry
        }
    }, [transactionStatus.data, checkoutRequestId, router]);

    useEffect(() => {
        if (!checkoutRequestId) return;
        const timeout = setTimeout(() => {
            if (!hasRedirectedRef.current) {
                setIsProcessingPayment(false);
                setIsMpesaModalOpen(false);
                toast.info(
                    "Still waiting for M-PESA confirmation. You can check your orders page.",
                    toastStyles,
                );
                setCheckoutRequestId(null);
            }
        }, 120000);
        return () => clearTimeout(timeout);
    }, [checkoutRequestId]);

    const items = useMemo(() => cart?.items ?? [], [cart]);
    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0),
        [items],
    );

    if (status !== "authenticated") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background text-foreground">
                <div className="bg-card border border-border shadow-md rounded-xl p-8 text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-3 text-primary">Shopping Cart</h1>
                    <p className="text-muted-foreground">
                        Please <Link href="/auth/login" className="underline text-primary">sign in</Link> to use the cart.
                    </p>
                </div>
            </div>
        );
    }

    function onQtyChange(productId: string, qty: number) {
        if (qty <= 0) return;
        update.mutate({ productId, quantity: qty });
    }

    const openMpesaModal = () => {
        if (subtotal <= 0) {
            toast.error("Add at least one item to proceed with checkout.", toastStyles);
            return;
        }
        setIsMpesaModalOpen(true);
    };

    const handleMpesaPayment = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (subtotal <= 0) {
            toast.error("Your cart is empty.", toastStyles);
            return;
        }
        if (!phoneNumber.trim()) {
            toast.error("Enter the phone number registered with M-PESA.", toastStyles);
            return;
        }

        toast.info("Sending payment request…", toastStyles);
        try {
            await mpesaPayment.mutateAsync({
                amount: Number(subtotal.toFixed(2)),
                phoneNumber,
            });
            // Phone number cleared on success or failure in useEffect
        } catch {
            // Handled in onError
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <ClientNavbar />

            <div className="max-w-7xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-extrabold mb-10 text-primary text-center lg:text-left">
                    Your Shopping Cart 🛒
                </h1>

                {items.length === 0 ? (
                    <div className="text-center bg-secondary/20 p-16 rounded-xl border border-border">
                        <p className="text-xl text-muted-foreground mb-6">Your cart is empty 😢</p>
                        <Link
                            href="/shop"
                            className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary/90 transition"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 order-1 space-y-6">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-card border border-secondary/20 rounded-xl p-6 shadow-lg hover:shadow-lg transition"
                                >
                                    <div className="w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
                                        <Image
                                            src={
                                                item.product?.image
                                                    ? item.product.image.startsWith("/uploads")
                                                        ? item.product.image
                                                        : `/uploads/${item.product.image}`
                                                    : "/placeholder.png"
                                            }
                                            alt={item.product?.name ?? "Product"}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">
                                            {item.product ? (
                                                <Link href={`/shop/${item.productId}`} className="hover:text-primary transition">
                                                    {item.product.name}
                                                </Link>
                                            ) : (
                                                item.productId
                                            )}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            KES {(item.product?.price ?? 0).toLocaleString()} each
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => onQtyChange(item.productId, item.quantity - 1)}
                                            disabled={isProcessingPayment}
                                            className="w-10 h-10 rounded-full border border-border hover:bg-primary hover:text-primary-foreground transition disabled:opacity-50"
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            min={1}
                                            value={item.quantity}
                                            onChange={(e) => onQtyChange(item.productId, Number.parseInt(e.target.value, 10) || 1)}
                                            disabled={isProcessingPayment}
                                            className="w-16 text-center border border-border rounded bg-background py-2 disabled:opacity-50"
                                        />
                                        <button
                                            onClick={() => onQtyChange(item.productId, item.quantity + 1)}
                                            disabled={isProcessingPayment}
                                            className="w-10 h-10 rounded-full border border-border hover:bg-primary hover:text-primary-foreground transition disabled:opacity-50"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="text-right w-full sm:w-auto">
                                        <p className="font-bold text-lg">
                                            KES {((item.product?.price ?? 0) * item.quantity).toLocaleString()}
                                        </p>
                                        <button
                                            onClick={() => remove.mutate(item.productId)}
                                            disabled={isProcessingPayment}
                                            className="text-red-600 text-sm hover:underline mt-2 block disabled:opacity-50"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1 order-2">
                            <div className="bg-secondary rounded-2xl p-8 text-white sticky top-6 border border-white/10">
                                <h2 className="text-2xl font-bold mb-8">Order Summary</h2>

                                <div className="space-y-6">
                                    <div className="flex justify-between text-lg">
                                        <span className="text-white/80">Subtotal</span>
                                        <span className="font-bold text-primary text-xl">
                                            KES {subtotal.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="border-t border-white/20 pt-6">
                                        <div className="flex justify-between text-xl font-bold">
                                            <span>Total</span>
                                            <span className="text-primary">KES {subtotal.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 mt-8">
                                        <button
                                            onClick={() => clear.mutate()}
                                            disabled={isProcessingPayment}
                                            className="pl-60 text-red-500 underline transition text-lg disabled:opacity-50"
                                        >
                                            Clear Cart
                                        </button>

                                        <button
                                            onClick={openMpesaModal}
                                            disabled={mpesaPayment.isPending || isProcessingPayment}
                                            className="bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition disabled:opacity-70 shadow-lg"
                                        >
                                            {isProcessingPayment ? "Processing..." : mpesaPayment.isPending ? "Sending..." : "Pay with M-Pesa"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* M-Pesa Modal with Processing State */}
            {isMpesaModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
                    <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md shadow-xl space-y-4">
                        {isProcessingPayment ? (
                            // Processing state
                            <>
                                <div className="text-center py-4">
                                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                                    <h2 className="text-lg font-semibold text-primary mb-2">
                                        Waiting for Payment
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Check your phone for the M-PESA prompt
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        This may take a few seconds...
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                                        Do not close this page
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsProcessingPayment(false);
                                        setIsMpesaModalOpen(false);
                                        setCheckoutRequestId(null);
                                    }}
                                    className="w-full px-4 py-2 rounded border border-border text-sm hover:bg-accent transition"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            // Payment form
                            <>
                                <h2 className="text-lg font-semibold text-primary">Complete Payment</h2>
                                <p className="text-sm text-muted-foreground">
                                    Enter the M-PESA number that should receive the STK prompt. Ensure the phone is on and has network.
                                </p>
                                <form className="space-y-4" onSubmit={handleMpesaPayment}>
                                    <div>
                                        <label htmlFor="mpesa-phone" className="block text-sm font-medium mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            id="mpesa-phone"
                                            type="tel"
                                            placeholder="e.g. 2547XXXXXXXX"
                                            className="w-full border border-border rounded px-3 py-2 bg-background"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            disabled={mpesaPayment.isPending}
                                            required
                                        />
                                    </div>
                                    <div className="text-sm flex justify-between">
                                        <span className="font-medium">Amount</span>
                                        <span>KES {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded border border-border"
                                            onClick={() => setIsMpesaModalOpen(false)}
                                            disabled={mpesaPayment.isPending}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
                                            disabled={mpesaPayment.isPending}
                                        >
                                            {mpesaPayment.isPending ? "Sending..." : "Confirm Payment"}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

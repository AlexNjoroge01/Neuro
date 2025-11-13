"use client";
import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
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
      setIsMpesaModalOpen(false);
      hasRedirectedRef.current = false;
      toast.info("Check your phone for the M-PESA prompt.", toastStyles);
    },
    onError: (error) => {
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
    if (!transactionStatus.data || !checkoutRequestId) {
      return;
    }

    const { resultCode, resultDesc, orderStatus } = transactionStatus.data;
    if (resultCode === 0 && orderStatus === "PAID" && !hasRedirectedRef.current) {
      toast.success("Payment confirmed! Redirecting to orders…", toastStyles);
      hasRedirectedRef.current = true;
      router.push("/orders");
      return;
    }

    if (resultCode && resultCode !== 0) {
      toast.error(resultDesc ?? "Payment failed. Please try again.", toastStyles);
      hasRedirectedRef.current = true;
      setCheckoutRequestId(null);
    }
  }, [transactionStatus.data, checkoutRequestId, router]);

  // Stop polling after ~2 minutes if still pending
  useEffect(() => {
    if (!checkoutRequestId) return;
    const timeout = setTimeout(() => {
      if (!hasRedirectedRef.current) {
        toast.info(
          "Still waiting for M-PESA confirmation. You can refresh orders to check status.",
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
            Please{" "}
            <Link href="/auth/login" className="underline text-primary">
              sign in
            </Link>{" "}
            to use the cart.
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

    toast.info("Processing payment…", toastStyles);
    try {
      await mpesaPayment.mutateAsync({
        amount: Number(subtotal.toFixed(2)),
        phoneNumber,
      });
      setPhoneNumber("");
    } catch {
      // Error toast handled in onError above.
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ClientNavbar />
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 py-8 text-primary">
          Your Shopping Cart 🛒
        </h1>

        {items.length === 0 ? (
          <div className="text-center bg-secondary/20 p-10 rounded-lg border border-border shadow-sm">
            <p className="text-muted-foreground mb-4">Your cart is empty 😢</p>
            <Link
              href="/shop"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-10">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 relative rounded-md overflow-hidden">
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
                      className="object-contain"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {item.product ? (
                        <Link href={`/shop/${item.productId}`} className="hover:underline">
                          {item.product.name}
                        </Link>
                      ) : (
                        item.productId
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      KES {(item.product?.price ?? 0).toLocaleString()}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onQtyChange(item.productId, item.quantity - 1)}
                      className="px-3 py-1  rounded  transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) =>
                        onQtyChange(item.productId, Number.parseInt(event.target.value, 10) || 1)
                      }
                      className="w-14 text-center border border-border rounded bg-background"
                    />
                    <button
                      onClick={() => onQtyChange(item.productId, item.quantity + 1)}
                      className="px-3 py-1  rounded transition"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="font-semibold text-sm">
                    KES {((item.product?.price ?? 0) * item.quantity).toLocaleString()}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => remove.mutate(item.productId)}
                    className="text-red-500 text-xs hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Summary Section */}
            <div className="bg-secondary border border-border p-6 rounded-lg shadow-sm space-y-4 max-w-md ml-auto">
              <div className="flex justify-between text-white text-lg font-semibold">
                <span>Subtotal</span>
                <span className="text-primary">KES {subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => clear.mutate()}
                  className="text-red-600 underline text-sm hover:text-red-700"
                >
                  Clear Cart
                </button>
                <button
                  onClick={openMpesaModal}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-60"
                  disabled={mpesaPayment.isPending}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {isMpesaModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-primary">Complete Payment</h2>
            <p className="text-sm text-muted-foreground">
              Enter the M-PESA number that should receive the STK prompt. Ensure the phone is on and
              has network.
            </p>
            <form className="space-y-4" onSubmit={handleMpesaPayment}>
              <div>
                <label htmlFor="mpesa-phone" className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  id="mpesa-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g. 2547XXXXXXXX"
                  className="w-full border border-border rounded px-3 py-2 bg-background"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
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
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

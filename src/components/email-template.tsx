import * as React from "react";

interface OrderEmailTemplateProps {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress?: string;
    orderId: string;
    orderTotal: number;
    orderItems: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    orderDate: string;
}

export function OrderEmailTemplate({
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    orderId,
    orderTotal,
    orderItems,
    orderDate,
}: OrderEmailTemplateProps) {
    return (
        <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ backgroundColor: "#0F172A", color: "#D6FF00", padding: "20px", textAlign: "center" }}>
                <h1 style={{ margin: 0 }}>🎉 New Order Received!</h1>
            </div>

            <div style={{ padding: "20px", backgroundColor: "#f9fafb" }}>
                <h2 style={{ color: "#0F172A", marginTop: 0 }}>Order Details</h2>

                <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                    <p style={{ margin: "5px 0" }}><strong>Order ID:</strong> {orderId}</p>
                    <p style={{ margin: "5px 0" }}><strong>Order Date:</strong> {orderDate}</p>
                    <p style={{ margin: "5px 0" }}><strong>Total Amount:</strong> KES {orderTotal.toLocaleString()}</p>
                </div>

                <h2 style={{ color: "#0F172A" }}>Customer Information</h2>

                <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                    <p style={{ margin: "5px 0" }}><strong>Name:</strong> {customerName || "Not provided"}</p>
                    <p style={{ margin: "5px 0" }}><strong>Email:</strong> {customerEmail}</p>
                    <p style={{ margin: "5px 0" }}><strong>Phone:</strong> {customerPhone || "Not provided"}</p>
                    {customerAddress && (
                        <p style={{ margin: "5px 0" }}><strong>Address:</strong> {customerAddress}</p>
                    )}
                </div>

                <h2 style={{ color: "#0F172A" }}>Order Items</h2>

                <table style={{ width: "100%", backgroundColor: "white", borderRadius: "8px", overflow: "hidden", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#0F172A", color: "#D6FF00" }}>
                            <th style={{ padding: "12px", textAlign: "left" }}>Item</th>
                            <th style={{ padding: "12px", textAlign: "center" }}>Quantity</th>
                            <th style={{ padding: "12px", textAlign: "right" }}>Price</th>
                            <th style={{ padding: "12px", textAlign: "right" }}>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderItems.map((item, index) => (
                            <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                <td style={{ padding: "12px" }}>{item.name}</td>
                                <td style={{ padding: "12px", textAlign: "center" }}>{item.quantity}</td>
                                <td style={{ padding: "12px", textAlign: "right" }}>KES {item.price.toLocaleString()}</td>
                                <td style={{ padding: "12px", textAlign: "right" }}>KES {(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ backgroundColor: "#f9fafb", fontWeight: "bold" }}>
                            <td colSpan={3} style={{ padding: "12px", textAlign: "right" }}>Total:</td>
                            <td style={{ padding: "12px", textAlign: "right" }}>KES {orderTotal.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style={{ marginTop: "30px", padding: "15px", backgroundColor: "#D6FF00", borderRadius: "8px", textAlign: "center" }}>
                    <p style={{ margin: 0, color: "#0F172A", fontWeight: "bold" }}>
                        ⚡ Action Required: Please arrange delivery for this order
                    </p>
                </div>
            </div>

            <div style={{ padding: "20px", textAlign: "center", color: "#6b7280", fontSize: "12px" }}>
                <p>This is an automated notification from Aggies World</p>
            </div>
        </div>
    );
}

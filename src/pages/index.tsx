import Link from "next/link";

export default function Home() {
	return (
		<div className="p-6 space-y-4">
			<h1 className="text-2xl font-semibold">Neuro POS</h1>
			<p className="text-muted-foreground">Starter dashboard is wired with tRPC + Prisma.</p>
			<nav className="grid gap-2">
				{/* <Link className="text-blue-600 underline" href="/products">Products</Link>
				<Link className="text-blue-600 underline" href="/customers">Customers</Link>
				<Link className="text-blue-600 underline" href="/inventory">Inventory</Link> */}
				<Link className="text-blue-600 underline" href="/dashboard">Dashboard</Link>
			</nav>
		</div>
	);
} 
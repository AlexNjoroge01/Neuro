import { getSession } from "next-auth/react";
import type { GetServerSideProps } from "next";

export default function Home() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // Admin/Superuser always go to dashboard
  if (session?.user?.role === "ADMIN" || session?.user?.role === "SUPERUSER") {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  // Everyone else (customers and unauthenticated users) go to shop
  return {
    redirect: {
      destination: "/shop",
      permanent: false,
    },
  };
};

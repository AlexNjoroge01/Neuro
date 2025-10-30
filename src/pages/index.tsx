import { getSession } from "next-auth/react";
import type { GetServerSideProps } from "next";

export default function Home() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  if (session?.user?.role === "ADMIN" || session?.user?.role === "SUPERUSER") {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }
  if (session?.user?.role === "CUSTOMER") {
    return {
      redirect: {
        destination: "/shop",
        permanent: false,
      },
    };
  }
  // Unauthenticated users land on login
  return {
    redirect: {
      destination: "/auth/login",
      permanent: false,
    },
  };
};

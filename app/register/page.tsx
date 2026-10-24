import { getCampuses } from "@/server/queries";
import { RegisterForm } from "./register-form";

export const metadata = {
  title: "Register | Local Loop",
  description: "Create an account to join your campus marketplace",
};

export default async function RegisterPage() {
  const campuses = await getCampuses();
  return <RegisterForm campuses={campuses} />;
}

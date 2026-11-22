import { FindTicketForm } from "@/features/ticket";
import { UploadPage } from "@/features/upload";

export default function Page() {
  return <UploadPage after={<FindTicketForm />} />;
}

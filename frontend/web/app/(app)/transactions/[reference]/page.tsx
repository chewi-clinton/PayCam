import { TransactionDetail } from "./transaction-detail";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  return <TransactionDetail reference={reference} />;
}

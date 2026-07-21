import { MerchantDetail } from "./merchant-detail";

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MerchantDetail id={id} />;
}

export default async function NovelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1>Novel Detail: {id}</h1>
    </div>
  );
}

export default async function NovelReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1>Novel Reader - Chapter {id}</h1>
    </div>
  );
}

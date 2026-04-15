import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExportProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("is_visible", true)
    .single();

  if (!profile) {
    notFound();
  }

  const { data: portfolioItems } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("profile_id", id)
    .order("sort_order", { ascending: true });

  const { data: sections } = await supabase
    .from("profile_sections")
    .select(`
      *,
      items:portfolio_items(*)
    `)
    .eq("profile_id", id)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  const unassignedItems = portfolioItems?.filter(
    (item) => !sections?.some((section) => section.items?.some((i: any) => i.id === item.id))
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-after: always;
            }
            @page {
              size: 8.5in 11in;
              margin: 0.5in;
            }
          }
        `
      }} />
      <div className="min-h-screen bg-white">

      {/* Print button - hidden when printing */}
      <div className="no-print fixed right-8 top-8 z-50">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-accent/90"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      {/* Export layout - optimized for print */}
      <div className="mx-auto max-w-4xl p-8">
        {/* Header */}
        <div className="mb-8 border-b-2 border-gray-900 pb-6">
          <div className="flex items-start gap-6">
            {profile.headshot_url && (
              <div className="h-32 w-32 shrink-0 overflow-hidden rounded-lg border-2 border-gray-900">
                <img
                  src={profile.headshot_url}
                  alt={profile.display_name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="mb-2 text-4xl font-bold text-gray-900">
                {profile.display_name}
              </h1>
              {profile.role && (
                <p className="mb-3 text-xl font-medium text-gray-700">{profile.role}</p>
              )}
              {profile.bio && (
                <p className="text-sm leading-relaxed text-gray-600">{profile.bio}</p>
              )}
              {profile.website_url && (
                <p className="mt-2 text-sm text-gray-500">{profile.website_url}</p>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Grid */}
        {unassignedItems && unassignedItems.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Portfolio</h2>
            <div className="grid grid-cols-2 gap-4">
              {unassignedItems
                .filter((item) => item.media_type === "image" && item.media_url)
                .slice(0, 6)
                .map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-lg border border-gray-300">
                    <img
                      src={item.media_url}
                      alt={item.title || "Portfolio item"}
                      className="h-48 w-full object-cover"
                    />
                    {item.title && (
                      <div className="bg-gray-50 p-2">
                        <p className="text-xs font-semibold text-gray-900">{item.title}</p>
                        {item.description && (
                          <p className="mt-1 text-xs text-gray-600">{item.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Custom Sections */}
        {sections && sections.length > 0 && (
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.id} className="page-break">
                <h2 className="mb-4 border-b border-gray-300 pb-2 text-2xl font-bold text-gray-900">
                  {section.title}
                </h2>
                {section.content && (
                  <p className="mb-4 text-sm leading-relaxed text-gray-700">
                    {section.content}
                  </p>
                )}
                {section.items && section.items.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {section.items
                      .filter((item: any) => item.media_type === "image" && item.media_url)
                      .slice(0, 4)
                      .map((item: any) => (
                        <div
                          key={item.id}
                          className="overflow-hidden rounded-lg border border-gray-300"
                        >
                          <img
                            src={item.media_url}
                            alt={item.title || "Section item"}
                            className="h-40 w-full object-cover"
                          />
                          {item.title && (
                            <div className="bg-gray-50 p-2">
                              <p className="text-xs font-semibold text-gray-900">
                                {item.title}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 border-t border-gray-300 pt-4 text-center">
          <p className="text-xs text-gray-500">
            {profile.display_name} • Member of MCS Film Club
          </p>
        </div>
      </div>
      </div>
    </>
  );
}

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Spinner } from "@shared/index.ts";

const schema = z.object({
  content: z.string().min(1).max(32000),
});

type FormValues = z.infer<typeof schema>;

export function Composer({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (text: string) => Promise<void>;
}) {
  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { content: "" },
  });

  const isLoading = disabled || formState.isSubmitting;

  const handleFormSubmit = async (values: FormValues) => {
    try {
      await onSend(values.content);
      reset();
    } catch (e) {
      console.error("[Composer] send failed", e);
    }
  };

  return (
    <form
      className="flex gap-2 border-t border-sf-border-subtle pt-3"
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <textarea
        className="min-h-[44px] flex-1 resize-y rounded-xl border border-sf-border bg-sf-raised px-3 py-2 text-sm text-sf-text outline-none ring-sf-teal/30 focus:ring-2 disabled:opacity-50"
        rows={2}
        placeholder="Paste a page URL, keywords, or feedback…"
        disabled={isLoading}
        {...register("content")}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="flex min-w-[72px] items-center justify-center gap-2 self-end rounded-xl bg-sf-primary px-4 py-2 text-sm font-medium text-white shadow-md shadow-sf-primary/20 transition-opacity hover:bg-sf-primary-hover disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Spinner />
            <span>Thinking…</span>
          </>
        ) : (
          <span>Send</span>
        )}
      </button>
    </form>
  );
}

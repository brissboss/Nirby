import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useMapPanels } from "@/app/(app)/_components/map-panels/MapPanelsContext";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSearchPlace } from "@/features/browse/hooks";
import { useErrorMessage } from "@/hooks/use-error-message";

type SearchBarProps = {
  searchPlace: ReturnType<typeof useSearchPlace>;
};

export function SearchBar({ searchPlace }: SearchBarProps) {
  const t = useTranslations();
  const { setSnap, snapPoints } = useMapPanels();
  const shouldPreventFocus = useRef(false);
  const getErrorMessage = useErrorMessage();

  const { mutate: searchPlaces, isPending, clearResults, lastSearchQueryText } = searchPlace;

  const searchSchema = z.object({
    search: z.string().min(1),
  });

  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: standardSchemaResolver(searchSchema),
    defaultValues: {
      search: lastSearchQueryText ?? "",
    },
  });

  useEffect(() => {
    form.reset({ search: lastSearchQueryText ?? "" });
  }, [lastSearchQueryText, form]);

  function onSubmit(values: z.infer<typeof searchSchema>) {
    setSnap(snapPoints[1]);

    (document.activeElement as HTMLElement)?.blur();

    searchPlaces(
      {
        searchQuery: values.search,
      },
      {
        onError: (error) => {
          toast.error(getErrorMessage(error));
          form.reset({ search: "" });
          clearResults();
        },
      }
    );
  }

  function onInvalid() {
    (document.activeElement as HTMLElement)?.blur();
    setSnap(snapPoints[0]);
    clearResults();
  }

  const handleBlur = () => {
    shouldPreventFocus.current = true;
    setSnap(snapPoints[1]);

    setTimeout(() => {
      shouldPreventFocus.current = false;
    }, 100);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.relatedTarget instanceof HTMLCanvasElement || shouldPreventFocus.current) {
      e.target.blur();
      setSnap(snapPoints[0]);
      return;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        <FormField
          control={form.control}
          name="search"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex flex-col gap-1">
                  <div className="relative">
                    <Input
                      {...field}
                      type="search"
                      enterKeyHint="search"
                      placeholder={t("common.buttons.search")}
                      className="pl-4 rounded-full [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      onChange={field.onChange}
                    />
                    {(form.formState.isDirty || lastSearchQueryText !== "") && (
                      <Button
                        type="button"
                        variant="link"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 "
                        onClick={(e) => {
                          e.preventDefault();
                          form.reset({ search: "" });
                          clearResults();
                          setSnap(snapPoints[0]);
                        }}
                      >
                        {isPending ? (
                          <Loader2 className="size-5 text-muted-foreground animate-spin" />
                        ) : (
                          <XIcon className="size-5 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

import React from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateProject, useCreateFile, getListProjectsQueryKey, getGetProjectStatsQueryKey } from "@workspace/api-client-react";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LANGUAGES, LANGUAGE_TEMPLATES } from "@/lib/templates";
import { useQueryClient } from "@tanstack/react-query";
import { SiPython, SiHtml5, SiTypescript, SiReact } from "react-icons/si";

const formSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional(),
  language: z.string().min(1, "Please select a language template"),
});

export default function NewProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      language: "html-css-js",
    },
  });

  const createProject = useCreateProject();
  const createFile = useCreateFile();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const project = await createProject.mutateAsync({
        data: {
          name: values.name,
          description: values.description,
          language: values.language,
        }
      });

      // Scaffold files from template
      const template = LANGUAGE_TEMPLATES[values.language];
      if (template) {
        for (const file of template.files) {
          await createFile.mutateAsync({
            id: project.id,
            data: {
              name: file.name,
              language: file.language,
              content: file.content
            }
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetProjectStatsQueryKey() });

      toast({
        title: "Project created",
        description: "Your new workspace is ready.",
      });

      setLocation(`/editor/${project.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating project",
        description: "Please try again later.",
      });
    }
  }

  return (
    <LayoutWrapper>
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/dashboard")}
          className="mb-6 -ml-4 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Project</CardTitle>
            <CardDescription>
              Choose a template and configure your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Template</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {LANGUAGES.map((lang) => (
                            <label
                              key={lang.id}
                              className={`
                                flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all
                                ${field.value === lang.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/50 hover:bg-accent'}
                              `}
                            >
                              <input
                                type="radio"
                                className="sr-only"
                                value={lang.id}
                                checked={field.value === lang.id}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                              <div className="mb-3 text-3xl">
                                {lang.id === 'html-css-js' && <SiHtml5 className="text-orange-500" />}
                                {lang.id === 'python' && <SiPython className="text-blue-500" />}
                                {lang.id === 'typescript' && <SiTypescript className="text-blue-600" />}
                                {lang.id === 'react' && <SiReact className="text-cyan-400" />}
                              </div>
                              <span className="font-medium text-sm text-center">{lang.name}</span>
                            </label>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Awesome App" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What will you build?" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={createProject.isPending} className="w-full sm:w-auto">
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  );
}
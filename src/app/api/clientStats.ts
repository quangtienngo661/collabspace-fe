import { taskApi } from "./taskApi";
import { workspaceApi } from "./workspaceApi";
import type { Project, Workspace } from "./types";

export async function enrichWorkspaceStats(workspace: Workspace): Promise<Workspace> {
  try {
    const [members, projects] = await Promise.all([
      workspaceApi.members(workspace.id),
      workspaceApi.listProjects(workspace.id),
    ]);
    return {
      ...workspace,
      memberCount: members.length,
      projectCount: projects.length,
    };
  } catch {
    return workspace;
  }
}

export async function enrichWorkspacesStats(workspaces: Workspace[]): Promise<Workspace[]> {
  return Promise.all(workspaces.map(enrichWorkspaceStats));
}

export async function enrichProjectTaskCount(project: Project): Promise<Project> {
  try {
    const { total } = await taskApi.list({
      workspaceId: project.workspaceId,
      projectId: project.id,
    });
    return { ...project, taskCount: total };
  } catch {
    return project;
  }
}

export async function enrichProjectsTaskCounts(projects: Project[]): Promise<Project[]> {
  return Promise.all(projects.map(enrichProjectTaskCount));
}

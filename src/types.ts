export type Page = 'inicio' | 'trilhas' | 'desafios' | 'documentacao' | 'comunidade' | 'oportunidades' | 'perfil';
export interface Lesson { id: string; title: string; duration: string; type: string; content: string[]; code: string; task: string; reference: string }
export interface Track { id: string; title: string; category: string; description: string; level: string; duration: string; color: string; symbol: string; skills: string[]; lessons: Lesson[] }
export interface Challenge { id: string; title: string; category: string; difficulty: string; duration: string; description: string; code?: string; options: string[] }
export interface Job { id: string; title: string; company: string; initials: string; location: string; type: string; color: string; technologies: string[]; description: string }
export interface Resource { id: string; title: string; category: string; description: string; url: string }
export interface Profile { name: string; headline: string; bio: string; github: string; skills: string[] }
export interface Project { id: string; title: string; description: string; url: string; technologies: string[] }
export interface Post { id: string; author: string; tag: string; body: string; created_at: string; liked: boolean; seed: boolean }
export interface Data { mode: 'demo'; tracks: Track[]; challenges: Challenge[]; jobs: Job[]; resources: Resource[]; completed: string[]; solved: string[]; xp: number; savedJobs: string[]; profile: Profile; projects: Project[]; posts: Post[] }

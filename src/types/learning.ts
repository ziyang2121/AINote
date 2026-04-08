export interface LearningTask {
  id: string;
  title: string;
  completed: boolean;
  resources: string[];
  subTasks: LearningTask[];
}

export interface LearningPlan {
  id: string;
  title: string;
  description: string;
  tasks: LearningTask[];
  checkInDates: string[];
  createdAt: string;
  updatedAt: string;
}

export type LearningPlanCreateInput = Omit<LearningPlan, 'id' | 'createdAt' | 'updatedAt'>;
export type LearningPlanUpdateInput = Partial<Omit<LearningPlan, 'id' | 'createdAt'>>;

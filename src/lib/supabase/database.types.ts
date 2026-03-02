export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            exercises: {
                Row: {
                    ai_thumbnail_url: string | null
                    created_at: string | null
                    description: string | null
                    description_es: string | null
                    difficulty: Database["public"]["Enums"]["difficulty_level"] | null
                    embedding: string | null
                    equipment: Database["public"]["Enums"]["equipment_required"]
                    force: Database["public"]["Enums"]["force_type"] | null
                    id: string
                    mechanic: Database["public"]["Enums"]["exercise_mechanic"] | null
                    name: string
                    name_es: string | null
                    primary_muscle: Database["public"]["Enums"]["muscle_group"]
                    secondary_muscles:
                    | Database["public"]["Enums"]["muscle_group"][]
                    | null
                    video_url: string | null
                }
                Insert: {
                    ai_thumbnail_url?: string | null
                    created_at?: string | null
                    description?: string | null
                    description_es?: string | null
                    difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
                    embedding?: string | null
                    equipment: Database["public"]["Enums"]["equipment_required"]
                    force?: Database["public"]["Enums"]["force_type"] | null
                    id?: string
                    mechanic?: Database["public"]["Enums"]["exercise_mechanic"] | null
                    name: string
                    name_es?: string | null
                    primary_muscle: Database["public"]["Enums"]["muscle_group"]
                    secondary_muscles?:
                    | Database["public"]["Enums"]["muscle_group"][]
                    | null
                    video_url?: string | null
                }
                Update: {
                    ai_thumbnail_url?: string | null
                    created_at?: string | null
                    description?: string | null
                    description_es?: string | null
                    difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
                    embedding?: string | null
                    equipment?: Database["public"]["Enums"]["equipment_required"]
                    force?: Database["public"]["Enums"]["force_type"] | null
                    id?: string
                    mechanic?: Database["public"]["Enums"]["exercise_mechanic"] | null
                    name?: string
                    name_es?: string | null
                    primary_muscle?: Database["public"]["Enums"]["muscle_group"]
                    secondary_muscles?:
                    | Database["public"]["Enums"]["muscle_group"][]
                    | null
                    video_url?: string | null
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    birth_date: string | null
                    created_at: string | null
                    current_level: number | null
                    current_xp: number | null
                    days_per_week: number | null
                    equipment: Database["public"]["Enums"]["equipment_access"] | null
                    full_name: string | null
                    gender: Database["public"]["Enums"]["gender_identity"] | null
                    goal: Database["public"]["Enums"]["fitness_goal"] | null
                    height_cm: number | null
                    id: string
                    injuries: string[] | null
                    level: Database["public"]["Enums"]["experience_level"] | null
                    minutes_per_session: number | null
                    updated_at: string | null
                    username: string | null
                    weight_kg: number | null
                }
                Insert: {
                    avatar_url?: string | null
                    birth_date?: string | null
                    created_at?: string | null
                    current_level?: number | null
                    current_xp?: number | null
                    days_per_week?: number | null
                    equipment?: Database["public"]["Enums"]["equipment_access"] | null
                    full_name?: string | null
                    gender?: Database["public"]["Enums"]["gender_identity"] | null
                    goal?: Database["public"]["Enums"]["fitness_goal"] | null
                    height_cm?: number | null
                    id: string
                    injuries?: string[] | null
                    level?: Database["public"]["Enums"]["experience_level"] | null
                    minutes_per_session?: number | null
                    updated_at?: string | null
                    username?: string | null
                    weight_kg?: number | null
                }
                Update: {
                    avatar_url?: string | null
                    birth_date?: string | null
                    created_at?: string | null
                    current_level?: number | null
                    current_xp?: number | null
                    days_per_week?: number | null
                    equipment?: Database["public"]["Enums"]["equipment_access"] | null
                    full_name?: string | null
                    gender?: Database["public"]["Enums"]["gender_identity"] | null
                    goal?: Database["public"]["Enums"]["fitness_goal"] | null
                    height_cm?: number | null
                    id?: string
                    injuries?: string[] | null
                    level?: Database["public"]["Enums"]["experience_level"] | null
                    minutes_per_session?: number | null
                    updated_at?: string | null
                    username?: string | null
                    weight_kg?: number | null
                }
                Relationships: []
            }
            user_recommendations: {
                Row: {
                    created_at: string
                    date: string
                    id: string
                    locale: string
                    modules: Json
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    date?: string
                    id?: string
                    locale?: string
                    modules?: Json
                    user_id: string
                }
                Update: {
                    created_at?: string
                    date?: string
                    id?: string
                    locale?: string
                    modules?: Json
                    user_id?: string
                }
                Relationships: []
            }
            workout_sets: {
                Row: {
                    created_at: string | null
                    exercise_id: string
                    id: string
                    is_warmup: boolean | null
                    reps: number | null
                    rest_seconds: number | null
                    rpe: number | null
                    set_order: number
                    weight_kg: number | null
                    workout_id: string
                }
                Insert: {
                    created_at?: string | null
                    exercise_id: string
                    id?: string
                    is_warmup?: boolean | null
                    reps?: number | null
                    rest_seconds?: number | null
                    rpe?: number | null
                    set_order: number
                    weight_kg?: number | null
                    workout_id: string
                }
                Update: {
                    created_at?: string | null
                    exercise_id?: string
                    id?: string
                    is_warmup?: boolean | null
                    reps?: number | null
                    rest_seconds?: number | null
                    rpe?: number | null
                    set_order?: number
                    weight_kg?: number | null
                    workout_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "workout_sets_exercise_id_fkey"
                        columns: ["exercise_id"]
                        isOneToOne: false
                        referencedRelation: "exercises"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "workout_sets_workout_id_fkey"
                        columns: ["workout_id"]
                        isOneToOne: false
                        referencedRelation: "workouts"
                        referencedColumns: ["id"]
                    },
                ]
            }
            workouts: {
                Row: {
                    created_at: string | null
                    duration_seconds: number | null
                    ended_at: string | null
                    id: string
                    name: string
                    notes: string | null
                    started_at: string | null
                    status: Database["public"]["Enums"]["workout_status"] | null
                    subjective_difficulty: number | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    duration_seconds?: number | null
                    ended_at?: string | null
                    id?: string
                    name: string
                    notes?: string | null
                    started_at?: string | null
                    status?: Database["public"]["Enums"]["workout_status"] | null
                    subjective_difficulty?: number | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    duration_seconds?: number | null
                    ended_at?: string | null
                    id?: string
                    name?: string
                    notes?: string | null
                    started_at?: string | null
                    status?: Database["public"]["Enums"]["workout_status"] | null
                    subjective_difficulty?: number | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "workouts_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            match_exercises: {
                Args: {
                    match_count: number
                    match_threshold: number
                    query_embedding: string
                }
                Returns: {
                    description: string
                    description_es: string | null
                    difficulty: Database["public"]["Enums"]["difficulty_level"]
                    equipment: Database["public"]["Enums"]["equipment_required"]
                    id: string
                    name: string
                    name_es: string | null
                    primary_muscle: Database["public"]["Enums"]["muscle_group"]
                    similarity: number
                }[]
            }
            update_exercise_embedding: {
                Args: { exercise_id: string; new_embedding: string }
                Returns: undefined
            }
        }
        Enums: {
            difficulty_level: "beginner" | "intermediate" | "advanced"
            equipment_access: "bodyweight" | "home_basic" | "gym_full"
            equipment_required:
            | "bodyweight"
            | "dumbbell"
            | "barbell"
            | "kettlebell"
            | "cable"
            | "machine"
            | "band"
            | "smith_machine"
            | "ez_bar"
            exercise_mechanic: "compound" | "isolation"
            experience_level:
            | "sedentary"
            | "beginner"
            | "intermediate"
            | "advanced"
            | "elite"
            fitness_goal:
            | "lose_fat"
            | "build_muscle"
            | "strength"
            | "health"
            | "performance"
            fitness_level: "beginner" | "intermediate" | "advanced" | "elite"
            force_type: "push" | "pull" | "static" | "hinge"
            gender_identity: "male" | "female" | "other"
            muscle_group:
            | "chest"
            | "lats"
            | "traps"
            | "shoulders"
            | "triceps"
            | "biceps"
            | "forearms"
            | "obliques"
            | "abs"
            | "lower_back"
            | "glutes"
            | "quads"
            | "hamstrings"
            | "calves"
            | "cardio_system"
            subscription_tier: "free" | "pro"
            training_type: "calisthenics" | "gym" | "hybrid" | "cardio"
            workout_status: "planned" | "active" | "completed" | "skipped"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

// Convenience helpers — use these in components instead of the verbose generics
export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"]

export type Enums<T extends keyof Database["public"]["Enums"]> =
    Database["public"]["Enums"][T]

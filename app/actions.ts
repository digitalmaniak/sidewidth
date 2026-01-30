'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        console.error('Login Error:', error)
        redirect(`/login?message=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { data: authData, error } = await supabase.auth.signUp({
        ...data,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        },
    })

    if (error) {
        console.error('Signup Error:', error)
        redirect(`/login?message=${encodeURIComponent(error.message)}`)
    }

    if (authData.user && !authData.session) {
        redirect('/login?message=Check+email+to+verify+account')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function createPost(formData: FormData) {
    const supabase = await createClient()

    const side_a = formData.get('side_a') as string
    const side_b = formData.get('side_b') as string
    const category = formData.get('category') as string
    // Optional: lat/long/location_name could be added here if we gather them

    if (!side_a || !side_b || !category) {
        redirect('/create?message=Missing+Required+Fields')
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if profile exists, if not create one? 
    // Trigger should handle this, or we rely on 'profiles' existing.
    // We'll trust the RLS and trigger (if exists) or just insert. 
    // Ideally, a trigger on auth.users insert creates the profile. 
    // For now, let's assume the profile exists or is not strictly required for constraints 
    // (though schema says created_by references profiles(id))

    // We should make sure a profile exists for this user.
    // Using `upsert` on profiles might be a safe bet here if we aren't sure.
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

    if (profileError) {
        console.error("Error ensuring profile:", profileError)
        redirect('/create?message=Profile+Error+Contact+Support')
    }


    const { error } = await supabase
        .from('posts')
        .insert({
            side_a,
            side_b,
            category,
            created_by: user.id
        })

    if (error) {
        console.error("Error creating post:", error)
        redirect('/create?message=Failed+to+create+post')
    }

    revalidatePath('/')
    redirect('/')
}

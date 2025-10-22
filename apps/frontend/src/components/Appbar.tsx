"use client"

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import Link from 'next/link'
import { useTheme } from 'next-themes'

export function Appbar() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex justify-between items-center px-6 py-4 max-w-6xl mx-auto border-b-2 border-gray-200">
      
      <div className="text-2xl font-bold text-black dark:text-white">
        <Link href={"/"}>Dpin-Uptime</Link>
      </div>

      <div className="flex items-center space-x-3">

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="px-3 py-2 border rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        <SignedOut>
          <SignInButton>
            <button className="px-4 py-2 bg-white text-black border border-black rounded-lg hover:bg-gray-100 dark:bg-black dark:text-white dark:border-white dark:hover:bg-gray-900 transition">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="px-4 py-2 bg-black text-white border border-black rounded-lg hover:bg-gray-800 dark:bg-white dark:text-black dark:border-black dark:hover:bg-gray-200 transition">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>

        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "h-10 w-10 rounded-full border border-black dark:border-white",
              },
            }}
          />
        </SignedIn>

      </div>
    </div>
  )
}

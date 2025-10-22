"use client"

export function Footer() {

  return (
    <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between">
          <span>Dpin-Uptime © 2025. All rights reserved.</span>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="mailto:akashsingh3414@gmail.com" className="hover:underline">akashsingh3414@gmail.com</a>
            <a href="https://akashsingh3414.vercel.app" className="hover:underline">Contact Developer</a>
          </div>
        </div>
      </footer>
  )
}

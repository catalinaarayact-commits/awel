import { Logo } from '@/components/brand/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FEF8F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Marca */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <Logo markSize={48} textVariant="purple" />
          <p className="font-sans text-xs font-medium uppercase tracking-widest text-[#7A6B8A]">
            Wellness & Belleza
          </p>
        </div>

        {children}

      </div>
    </div>
  )
}

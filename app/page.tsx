import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F172A]">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-[#F8FAFC] mb-4">
              QuickHub<span className="text-[#F59E0B]">GH</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#94A3B8] mb-6">
              Ghana&apos;s Social-Media-Style Gig Economy Platform
            </p>
            <div className="w-24 h-1 bg-[#F59E0B] mx-auto"></div>
          </div>

          {/* Value Proposition */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-16 md:mb-24">
            <div className="bg-[#1E293B] rounded-2xl shadow-xl p-8 md:p-10 border border-[#334155]">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-[#0F172A] rounded-lg flex items-center justify-center mr-4 border border-[#334155]">
                  <span className="text-2xl text-[#F59E0B]">💼</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#F8FAFC]">
                  Find Work That Fits Your Skills
                </h2>
              </div>
              <p className="text-[#94A3B8] text-lg mb-6">
                Connect with local businesses and individuals looking for your expertise. 
                From tech to handiwork, cooking to cleaning - your skills are in demand.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-[#F59E0B] mr-2">✓</span>
                  <span className="text-[#F8FAFC]">No commission fees - flat subscription only</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#F59E0B] mr-2">✓</span>
                  <span className="text-[#F8FAFC]">Real-time job notifications</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#F59E0B] mr-2">✓</span>
                  <span className="text-[#F8FAFC]">Build your reputation with ratings</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1E293B] rounded-2xl shadow-xl p-8 md:p-10 border border-[#334155]">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-[#0F172A] rounded-lg flex items-center justify-center mr-4 border border-[#334155]">
                  <span className="text-2xl text-[#F59E0B]">👥</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#F8FAFC]">
                  Hire Trusted Local Talent
                </h2>
              </div>
              <p className="text-[#94A3B8] text-lg mb-6">
                Post jobs and find skilled Ghanaians ready to work. 
                View portfolios, ratings, and skills before hiring.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="text-[#F59E0B] mr-2">✓</span>
                  <span className="text-[#F8FAFC]">Mobile-first design for on-the-go hiring</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#F59E0B] mr-2">✓</span>
                  <span className="text-[#F8FAFC]">Secure Ghana Cedi (GHS) payments</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#F59E0B] mr-2">✓</span>
                  <span className="text-[#F8FAFC]">Real-time chat and updates</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="max-w-md mx-auto mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-[#F8FAFC] mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-[#94A3B8] mb-6">
                Sign in with your Google account to access the platform. 
                No passwords to remember, just secure OAuth authentication.
              </p>
            </div>
            
            <div className="mb-8">
              <GoogleSignInButton />
            </div>

            <div className="text-sm text-[#94A3B8] max-w-lg mx-auto">
              <p className="mb-2">
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </p>
              <p>
                Need help? Contact us at support@quickhubgh.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#0F172A] border-t border-[#334155] py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h4 className="text-xl font-bold text-[#F8FAFC]">QuickHubGH</h4>
              <p className="text-[#94A3B8]">Empowering Ghanaian talent</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-[#94A3B8]">
                &copy; {new Date().getFullYear()} QuickHubGH Platform. All rights reserved.
              </p>
              <p className="text-[#64748B] text-sm mt-1">
                Made with ❤️ in Ghana
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
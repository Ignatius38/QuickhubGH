import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto text-center px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            QuickHubGH
          </h1>
          <p className="text-lg md:text-2xl text-gray-700 mb-4">
            Ghana&apos;s Social Gig Economy Platform
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Connect with skilled professionals or find your next opportunity. 
            No commissions, just a flat subscription fee.
          </p>
        </div>

        {/* Sign In Button */}
        <div className="mb-16">
          <GoogleSignInButton />
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">💼</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Post Jobs
            </h3>
            <p className="text-gray-600">
              Find skilled workers for tech, cooking, cleaning, handiwork, and more.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Find Work
            </h3>
            <p className="text-gray-600">
              Browse opportunities, showcase your portfolio, and build your reputation.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Commission
            </h3>
            <p className="text-gray-600">
              Pay a flat subscription fee. Keep 100% of what you earn.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-gray-500 text-sm">
          <p>Secure authentication with Google • Mobile Money & Card payments supported</p>
        </div>
      </div>
    </div>
  );
}

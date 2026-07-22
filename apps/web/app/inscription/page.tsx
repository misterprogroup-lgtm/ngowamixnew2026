import RegisterForm from '../components/auth/RegisterForm';

export const metadata = {
  title: 'Inscription - Ngowamix',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-dark-900 bg-mesh flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-gradient">Ngowamix</span>
          </h1>
          <p className="mt-2 text-dark-400">Créez votre compte gratuit</p>
        </div>

        <div className="card backdrop-blur-xl">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}

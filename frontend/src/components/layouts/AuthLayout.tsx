import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-4">
      <div className="w-full max-w-md w-full animate-fade-in">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;

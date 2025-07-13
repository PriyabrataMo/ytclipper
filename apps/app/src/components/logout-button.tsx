import { Button } from '@ytclipper/ui';
import { useAuth } from '../hooks/useAuth';

const LogoutButton = () => {
  const { logout, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Button disabled>Loading...</Button>;
  }

  if (!isAuthenticated) {
    return null; // Don't show logout button if not authenticated
  }

  return (
    <Button
      onClick={() => {
        logout();
      }}
      variant='outline'
      className='border-red-500 text-red-500 hover:bg-red-50'
    >
      Log Out
    </Button>
  );
};

export default LogoutButton;

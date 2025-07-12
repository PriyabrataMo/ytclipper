import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@ytclipper/ui';

const LogoutButton = () => {
  const { logout, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <Button disabled>Loading...</Button>;
  }

  if (!isAuthenticated) {
    return null; // Don't show logout button if not authenticated
  }

  return (
    <Button
      onClick={() => {
        window.postMessage(
          { type: 'AUTH0_LOGOUT', timestamp: Date.now() },
          'http://localhost:5173',
        );
        logout({
          logoutParams: {
            returnTo: window.location.origin,
          },
        });
      }}
      variant='outline'
      className='border-red-500 text-red-500 hover:bg-red-50'
    >
      Log Out
    </Button>
  );
};

export default LogoutButton;

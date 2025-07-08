import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@ytclipper/ui';

const LoginButton = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <Button disabled>
        Loading...
      </Button>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <Button
      onClick={() => loginWithRedirect({
        authorizationParams: {
          redirect_uri: `${window.location.origin}`,
        }
      })}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      Log In
    </Button>
  );
};

export default LoginButton;

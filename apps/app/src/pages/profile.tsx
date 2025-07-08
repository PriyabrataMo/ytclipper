import { useAuth0 } from '@auth0/auth0-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@ytclipper/ui';
import { Link } from 'react-router';

import LogoutButton from '../components/logout-button';

export default function ProfilePage() {
  const { user } = useAuth0();

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profile</h1>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.picture && (
            <img
              src={user.picture}
              alt={user.name}
              className="w-20 h-20 rounded-full"
            />
          )}
          <div className="space-y-2">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Email Verified:</strong> {user?.email_verified ? 'Yes' : 'No'}</p>
            <p><strong>Last Updated:</strong> {user?.updated_at}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

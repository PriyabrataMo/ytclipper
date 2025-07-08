import { Button, Card, CardHeader, CardTitle, CardContent } from '@ytclipper/ui';

import LogoutButton from '../components/logout-button';
import UserProfile from '../components/user-profile';

export default function DashboardPage() {

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile */}
        <UserProfile />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full">Create New Clip</Button>
            <Button variant="outline" className="w-full">Browse Clips</Button>
            <Button variant="outline" className="w-full">Export History</Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">No recent activity to show.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ProfileForm from '@/components/profile/ProfileForm.new';
import SubscriptionManagement from '@/components/subscription/SubscriptionManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get tab from URL or default to 'profile'
  const tabFromUrl = searchParams.get('tab') || 'profile';
  const validTabs = ['profile', 'preferences', 'subscription'];
  const [activeTab, setActiveTab] = useState(
    validTabs.includes(tabFromUrl) ? tabFromUrl : 'profile'
  );
  
  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };
  
  // Sync state with URL changes (e.g., browser back/forward)
  useEffect(() => {
    const urlTab = searchParams.get('tab') || 'profile';
    if (validTabs.includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams, activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            Update your profile information and preferences
          </p>
        </div>

        <Tabs
          defaultValue="profile"
          className="w-full"
          value={activeTab}
          onValueChange={handleTabChange}
        >
          <TabsList className="grid w-full grid-cols-3 sm:w-[600px] mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          <div className="space-y-6">
            <TabsContent value="profile" className="space-y-6 m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your professional details and social links
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Account Preferences</CardTitle>
                  <CardDescription>
                    Manage your account settings and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="py-10 text-center text-muted-foreground">
                    <p>Preferences settings will be available soon.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="m-0">
              <SubscriptionManagement />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import {
  IconUser,
  IconMail,
  IconCalendar,
  IconShield,
} from "@tabler/icons-react";

export function ProfileGeneralTab({
  user,
  editedUser,
  setEditedUser,
  isEditing,
  formatDate,
}: {
  user: any;
  editedUser: any;
  setEditedUser: (user: any) => void;
  isEditing: boolean;
  formatDate: (dateString: string) => string;
}) {
  return (
    <TabsContent value="general" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <div className="flex items-center gap-2">
                <IconUser className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="first_name"
                  value={editedUser.first_name || ""}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      first_name: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <div className="flex items-center gap-2">
                <IconUser className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="last_name"
                  value={editedUser.last_name || ""}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      last_name: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex items-center gap-2">
              <IconUser className="h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                value={editedUser.username || ""}
                onChange={(e) =>
                  setEditedUser({
                    ...editedUser,
                    username: e.target.value,
                  })
                }
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex items-center gap-2">
              <IconMail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={editedUser.email || ""}
                onChange={(e) =>
                  setEditedUser({
                    ...editedUser,
                    email: e.target.value,
                  })
                }
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View your account status and details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <IconCalendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Joined</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(user.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <IconShield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Account ID</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {user.id}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

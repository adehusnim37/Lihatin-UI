import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";

export default function RegisterPage() {
    return (
        <div className="max-w-xl mx-auto mt-10">
            <Card>
                <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>
                        Enter your details to create a new account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" type="text" placeholder="Enter your name" required={true}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="Enter your email" required={true}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" placeholder="Create a password" required={true}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Confirm your password"
                                required={true}
                            />
                        </div>
                            <div className="space-y-1">
                                <div className="flex-direction: row flex items-center justify-between">
                                    <Label htmlFor="phone">Secret Code</Label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                aria-label="Info Secret Code"
                                                className="text-xs text-muted-foreground hover:text-foreground rounded-sm p-1"
                                            >
                                                ⓘ
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="max-w-xs">
                                            <p className="text-xs">
                                                Secret code adalah kode opsional yang dapat digunakan untuk aktivasi
                                                atau Fitur khusus dalam aplikasi. Jika Anda tidak memiliki kode, Anda
                                                dapat
                                                mengosongkannya.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <Input id="phone" type="text" placeholder="Enter secret code"/>
                            </div>
                        <Button type="submit" className="w-full">
                            Register
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

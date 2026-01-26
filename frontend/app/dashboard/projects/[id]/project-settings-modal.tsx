'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Pencil, Trash2, Plus, X, ChevronUp, ChevronDown, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProjectSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  onProjectUpdate?: (newName: string) => void;
  onSwimLanesUpdate?: () => void;
}

export function ProjectSettingsModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  onProjectUpdate,
  onSwimLanesUpdate,
}: ProjectSettingsModalProps) {
  const { getToken } = useAuth();
  const [name, setName] = useState(projectName);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingRoleValue, setEditingRoleValue] = useState('');

  // Users tab state
  const [users, setUsers] = useState<Array<{ id: string; email: string; first_name: string | null; last_name: string | null }>>([]);
  const [userRoles, setUserRoles] = useState<Array<{ id: string; user_id: string; role: string; user: { id: string; email: string; first_name: string | null; last_name: string | null } }>>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [editingUserRole, setEditingUserRole] = useState<string | null>(null);
  const [editingUserRoleValue, setEditingUserRoleValue] = useState('');

  // Swim lanes state
  const [swimLanes, setSwimLanes] = useState<Array<{ swim_lane_id: string; name: string; order: number }>>([]);
  const [newSwimLaneName, setNewSwimLaneName] = useState('');
  const [isLoadingSwimLanes, setIsLoadingSwimLanes] = useState(false);
  const [editingSwimLane, setEditingSwimLane] = useState<string | null>(null);
  const [editingSwimLaneValue, setEditingSwimLaneValue] = useState('');

  // Fetch project data when modal opens
  useEffect(() => {
    if (open) {
      fetchProjectData();
      fetchUsers();
      fetchUserRoles();
      fetchSwimLanes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

  // Update local state when projectName prop changes
  useEffect(() => {
    setName(projectName);
  }, [projectName]);

  const fetchProjectData = async () => {
    setIsLoadingRoles(true);
    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }

      const data = await response.json();
      setRoles(data.roles || []);
    } catch (err) {
      console.error('Failed to fetch project data:', err);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    if (name.trim() === projectName) {
      // No changes to save
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update project');
      }

      const updatedProject = await response.json();

      // Notify parent component of the update
      if (onProjectUpdate) {
        onProjectUpdate(updatedProject.name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRole.trim()) {
      return;
    }

    if (roles.includes(newRole.trim())) {
      setError('Role already exists');
      return;
    }

    const updatedRoles = [...roles, newRole.trim()];
    await updateRoles(updatedRoles);
    setNewRole('');
  };

  const handleEditRole = (oldRole: string) => {
    setEditingRole(oldRole);
    setEditingRoleValue(oldRole);
  };

  const handleSaveEdit = async () => {
    if (!editingRole || !editingRoleValue.trim()) {
      return;
    }

    if (editingRoleValue.trim() !== editingRole && roles.includes(editingRoleValue.trim())) {
      setError('Role already exists');
      return;
    }

    const updatedRoles = roles.map(r => r === editingRole ? editingRoleValue.trim() : r);
    await updateRoles(updatedRoles);
    setEditingRole(null);
    setEditingRoleValue('');
  };

  const handleRemoveRole = async (roleToRemove: string) => {
    const updatedRoles = roles.filter(r => r !== roleToRemove);
    await updateRoles(updatedRoles);
  };

  const updateRoles = async (updatedRoles: string[]) => {
    setIsLoadingRoles(true);
    setError(null);

    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          roles: updatedRoles,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update roles');
      }

      const updatedProject = await response.json();
      // Use the roles from the server response to ensure consistency
      setRoles(updatedProject.roles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/projects/${projectId}/user-roles`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUserRoles(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleAddUserRole = async () => {
    if (!selectedUserId || !selectedRole) {
      setError('Please select both a user and a role');
      return;
    }

    setIsLoadingUsers(true);
    setError(null);

    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/projects/${projectId}/user-roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          user_id: selectedUserId,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to add user');
      }

      setSelectedUserId('');
      setSelectedRole('');
      await fetchUserRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleEditUserRole = (userRoleId: string, currentRole: string) => {
    setEditingUserRole(userRoleId);
    setEditingUserRoleValue(currentRole);
  };

  const handleSaveUserRoleEdit = async () => {
    if (!editingUserRole || !editingUserRoleValue.trim()) {
      return;
    }

    setIsLoadingUsers(true);
    setError(null);

    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/projects/${projectId}/user-roles/${editingUserRole}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: editingUserRoleValue.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update user');
      }

      setEditingUserRole(null);
      setEditingUserRoleValue('');
      await fetchUserRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleRemoveUserRole = async (userRoleId: string) => {
    setIsLoadingUsers(true);
    setError(null);

    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/projects/${projectId}/user-roles/${userRoleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to remove user');
      }

      await fetchUserRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchSwimLanes = async () => {
    setIsLoadingSwimLanes(true);
    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/swim-lanes/project/${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch swim lanes');
      }

      const data = await response.json();
      setSwimLanes(data);
    } catch (err) {
      console.error('Failed to fetch swim lanes:', err);
    } finally {
      setIsLoadingSwimLanes(false);
    }
  };

  const handleAddSwimLane = async () => {
    if (!newSwimLaneName.trim()) {
      setError('Status name is required');
      return;
    }

    setIsLoadingSwimLanes(true);
    setError(null);

    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      // Calculate next order value
      const nextOrder = swimLanes.length > 0
        ? Math.max(...swimLanes.map(sl => sl.order)) + 1
        : 0;

      const response = await fetch('/api/swim-lanes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          name: newSwimLaneName.trim(),
          order: nextOrder,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create status');
      }

      setNewSwimLaneName('');
      await fetchSwimLanes();
      onSwimLanesUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingSwimLanes(false);
    }
  };

  const handleEditSwimLane = (swimLaneId: string, currentName: string) => {
    setEditingSwimLane(swimLaneId);
    setEditingSwimLaneValue(currentName);
  };

  const handleSaveSwimLaneEdit = async () => {
    if (!editingSwimLane || !editingSwimLaneValue.trim()) {
      return;
    }

    setIsLoadingSwimLanes(true);
    setError(null);

    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/swim-lanes/${editingSwimLane}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingSwimLaneValue.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update status');
      }

      setEditingSwimLane(null);
      setEditingSwimLaneValue('');
      await fetchSwimLanes();
      onSwimLanesUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingSwimLanes(false);
    }
  };

  const handleRemoveSwimLane = async (swimLaneId: string) => {
    setIsLoadingSwimLanes(true);
    setError(null);

    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/swim-lanes/${swimLaneId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to remove status');
      }

      await fetchSwimLanes();
      onSwimLanesUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingSwimLanes(false);
    }
  };

  const handleMoveSwimLane = async (swimLaneId: string, direction: 'up' | 'down') => {
    const currentIndex = swimLanes.findIndex(sl => sl.swim_lane_id === swimLaneId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= swimLanes.length) return;

    setIsLoadingSwimLanes(true);
    setError(null);

    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const currentLane = swimLanes[currentIndex];
      const targetLane = swimLanes[newIndex];

      // Swap orders
      const currentOrder = currentLane.order;
      const targetOrder = targetLane.order;

      // Update both swim lanes
      const updatePromises = [
        fetch(`/api/swim-lanes/${currentLane.swim_lane_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ order: targetOrder }),
        }),
        fetch(`/api/swim-lanes/${targetLane.swim_lane_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ order: currentOrder }),
        }),
      ];

      const responses = await Promise.all(updatePromises);
      const allOk = responses.every(r => r.ok);

      if (!allOk) {
        throw new Error('Failed to reorder statuses');
      }

      await fetchSwimLanes();
      onSwimLanesUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingSwimLanes(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Manage settings for {projectName}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className={`grid w-full ${roles.length > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="statuses">Statuses</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            {roles.length > 0 && (
              <TabsTrigger value="users">Users</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="general" className="mt-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="project-name" className="text-sm font-medium">
                  Project Name
                </label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  disabled={isLoading}
                  className={error ? 'border-destructive' : ''}
                  placeholder="Enter project name"
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isLoading || name.trim() === projectName}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="statuses" className="mt-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {swimLanes.length > 0 && (
                <div className="space-y-2">
                  {swimLanes.map((swimLane, index) => (
                    <div
                      key={swimLane.swim_lane_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      {editingSwimLane === swimLane.swim_lane_id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingSwimLaneValue}
                            onChange={(e) => setEditingSwimLaneValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveSwimLaneEdit();
                              } else if (e.key === 'Escape') {
                                setEditingSwimLane(null);
                                setEditingSwimLaneValue('');
                              }
                            }}
                            className="flex-1"
                            autoFocus
                            disabled={isLoadingSwimLanes}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={handleSaveSwimLaneEdit}
                            disabled={isLoadingSwimLanes}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingSwimLane(null);
                              setEditingSwimLaneValue('');
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleMoveSwimLane(swimLane.swim_lane_id, 'up')}
                                disabled={isLoadingSwimLanes || index === 0}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => handleMoveSwimLane(swimLane.swim_lane_id, 'down')}
                                disabled={isLoadingSwimLanes || index === swimLanes.length - 1}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-sm font-medium">{swimLane.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleEditSwimLane(swimLane.swim_lane_id, swimLane.name)}
                              disabled={isLoadingSwimLanes}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleRemoveSwimLane(swimLane.swim_lane_id)}
                              disabled={isLoadingSwimLanes}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <Input
                    value={newSwimLaneName}
                    onChange={(e) => {
                      setNewSwimLaneName(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSwimLane();
                      }
                    }}
                    placeholder="Enter status name"
                    disabled={isLoadingSwimLanes}
                  />
                  <Button
                    onClick={handleAddSwimLane}
                    disabled={isLoadingSwimLanes || !newSwimLaneName.trim()}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isLoadingSwimLanes && swimLanes.length === 0 && (
                <p className="text-sm text-muted-foreground">Loading statuses...</p>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="roles" className="mt-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {isLoadingRoles && roles.length === 0 && (
                <p className="text-sm text-muted-foreground">Loading roles...</p>
              )}

              {roles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      editingRole === role ? (
                        <div key={role} className="flex items-center gap-2">
                          <Input
                            value={editingRoleValue}
                            onChange={(e) => setEditingRoleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit();
                              } else if (e.key === 'Escape') {
                                setEditingRole(null);
                                setEditingRoleValue('');
                              }
                            }}
                            className="h-8 w-32"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={handleSaveEdit}
                            disabled={isLoadingRoles}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingRole(null);
                              setEditingRoleValue('');
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          key={role}
                          className="inline-flex items-center gap-1.5 rounded-full border border-transparent bg-secondary text-secondary-foreground px-3 py-1 text-xs font-semibold"
                        >
                          <span>{role}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 p-0 hover:bg-transparent -mr-1"
                            onClick={() => handleEditRole(role)}
                            disabled={isLoadingRoles}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 p-0 hover:bg-transparent text-destructive -mr-1"
                            onClick={() => handleRemoveRole(role)}
                            disabled={isLoadingRoles}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Add New Role</label>
                <div className="flex gap-2">
                  <Input
                    value={newRole}
                    onChange={(e) => {
                      setNewRole(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddRole();
                      }
                    }}
                    placeholder="Enter role name"
                    disabled={isLoadingRoles}
                  />
                  <Button
                    onClick={handleAddRole}
                    disabled={isLoadingRoles || !newRole.trim()}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="users" className="mt-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {userRoles.length > 0 && (
                <div className="space-y-2">
                  <div className="space-y-2">
                    {userRoles.map((userRole) => (
                      <div
                        key={userRole.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        {editingUserRole === userRole.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm font-medium">
                              {userRole.user.first_name} {userRole.user.last_name}
                            </span>
                            <select
                              value={editingUserRoleValue}
                              onChange={(e) => setEditingUserRoleValue(e.target.value)}
                              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                              disabled={isLoadingUsers}
                            >
                              <option value="">Select role</option>
                              {roles.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={handleSaveUserRoleEdit}
                              disabled={isLoadingUsers}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingUserRole(null);
                                setEditingUserRoleValue('');
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {userRole.user.first_name} {userRole.user.last_name}
                              </span>
                              <Badge variant="secondary">{userRole.role}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleEditUserRole(userRole.id, userRole.role)}
                                disabled={isLoadingUsers}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleRemoveUserRole(userRole.id)}
                                disabled={isLoadingUsers}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">Add User to Project</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value);
                      setError(null);
                    }}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={isLoadingUsers}
                  >
                    <option value="">Select user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value);
                      setError(null);
                    }}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={isLoadingUsers || roles.length === 0}
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handleAddUserRole}
                  disabled={isLoadingUsers || !selectedUserId || !selectedRole}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>

              {isLoadingUsers && userRoles.length === 0 && users.length === 0 && (
                <p className="text-sm text-muted-foreground">Loading...</p>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}


-- Deactivating a team member is now per organization (TeamService.toggleUserStatus). Until now it flipped the
-- global users.is_active flag, which locked the user out of every organization they belonged to — so one
-- organization's admin could cut a person off from unrelated organizations.
ALTER TABLE user_org_roles ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Anyone already deactivated globally stays deactivated in each of their organizations.
UPDATE user_org_roles r
SET is_active = FALSE
FROM users u
WHERE u.id = r.user_id
  AND u.is_active = FALSE;

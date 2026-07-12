import { TeamTable } from '@/components/team/TeamTable';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team Settings | billOS',
  description: 'Manage your organization team members and roles.',
};

export default function TeamSettingsPage() {
  return <TeamTable />;
}

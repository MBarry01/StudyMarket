import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Shield, LayoutDashboard, Package, Users, ListChecks, Webhook, DollarSign, FileText, MessageSquare, AlertTriangle } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Administration</h1>
          <p className="text-sm text-muted-foreground">Gestion centrale de la plateforme</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-60 flex-shrink-0">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4" />
                Vue d'ensemble
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/orders"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`
                }
              >
                <Package className="w-4 h-4" />
                Commandes
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/listings"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`
                }
              >
                <ListChecks className="w-4 h-4" />
                Annonces
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`
                }
              >
                <Users className="w-4 h-4" />
                Utilisateurs
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/webhooks"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`
                }
              >
                <Webhook className="w-4 h-4" />
                Webhook Logs
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/payouts"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`
                }
              >
                <DollarSign className="w-4 h-4" />
                Payouts
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/messages"
                className={({ isActive}) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`
                }
              >
                <MessageSquare className="w-4 h-4" />
                Messages
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/reports"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`
                }
              >
                <AlertTriangle className="w-4 h-4" />
                Signalements
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/audit"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                  }`
                }
              >
                <FileText className="w-4 h-4" />
                Audit Trail
              </NavLink>
            </li>
          </ul>
        </nav>

        <section className="flex-1">
          <div className="rounded-lg border border-border bg-card text-card-foreground p-4">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;


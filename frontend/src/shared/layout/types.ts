import React from 'react';

export interface SidebarNavItem {
    id: string;
    name: string;
    icon: React.ElementType;
    path?: string;
    shortcut?: string;
    color?: string;
}

export interface SidebarSection {
    title?: string;
    actionIcon?: React.ElementType;
    items: SidebarNavItem[];
} 
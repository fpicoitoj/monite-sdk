import { NavigationListItem } from '@/components/NavigationMenu/NavigationListItem';
import { IconAngleDown, IconAngleUp } from '@/icons';
import { Collapse, List } from '@mui/material';
import React, { ReactNode, useState } from 'react';

type NavigationListCollapseProps = {
  children: ReactNode;
  icon: ReactNode;
  label: ReactNode;
};

export const NavigationListCollapse = ({
  children,
  icon,
  label,
}: NavigationListCollapseProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <NavigationListItem
        endIcon={collapsed ? <IconAngleUp /> : <IconAngleDown />}
        icon={icon}
        onClick={(event) => {
          event.preventDefault();
          setCollapsed(!collapsed);
        }}
      >
        {label}
      </NavigationListItem>
      <Collapse in={collapsed} timeout="auto" unmountOnExit>
        <List>{children}</List>
      </Collapse>
    </>
  );
};

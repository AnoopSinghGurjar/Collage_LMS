import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon, description, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden bg-card border-card-border hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
              {title}
            </h3>
            {icon && <div className="h-8 w-8 text-primary/80 bg-primary/10 rounded-full flex items-center justify-center">{icon}</div>}
          </div>
          <div className="flex items-baseline space-x-3">
            <div className="text-3xl font-bold text-foreground">
              {value}
            </div>
            {trend && (
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-2">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

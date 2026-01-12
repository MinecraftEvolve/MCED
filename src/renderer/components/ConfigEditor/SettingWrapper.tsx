import React from "react";
import { ConfigSetting, UserComment } from "@/types/config.types";
import { CommentSection } from "./CommentSection";

interface SettingWrapperProps {
  setting: ConfigSetting;
  children: React.ReactNode;
  onAddComment: (settingKey: string, text: string) => void;
  onDeleteComment: (settingKey: string, commentId: string) => void;
}

export function SettingWrapper({
  setting,
  children,
  onAddComment,
  onDeleteComment,
}: SettingWrapperProps) {
  return (
    <div className="setting-with-comments border-t border-gray-200 dark:border-gray-700 pt-3">
      {children}
      <CommentSection
        comments={setting.userComments}
        onAddComment={(text) => onAddComment(setting.key, text)}
        onDeleteComment={(commentId) => onDeleteComment(setting.key, commentId)}
      />
    </div>
  );
}

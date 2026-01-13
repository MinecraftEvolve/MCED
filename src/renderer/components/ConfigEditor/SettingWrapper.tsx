import React from "react";
import { ConfigSetting } from "@/types/config.types";
import { BooleanInput } from "./BooleanInput";
import { SliderInput } from "./SliderInput";
import { TextInput } from "./TextInput";
import { DropdownInput } from "./DropdownInput";
import { ListInput } from "./ListInput";
import { CommentSection } from "./CommentSection";

interface SettingWrapperProps {
  setting: ConfigSetting;
  onChange: (value: unknown) => void;
  onAddComment: (settingKey: string, text: string) => void;
  onDeleteComment: (settingKey: string, commentId: string) => void;
}

export function SettingWrapper({
  setting,
  onChange,
  onAddComment,
  onDeleteComment,
}: SettingWrapperProps) {
  const renderInput = () => {
    switch (setting.type) {
      case "boolean":
        return <BooleanInput setting={setting} onChange={onChange as (value: boolean) => void} />;

      case "integer":
      case "float":
      case "number":
      case "range":
        return <SliderInput setting={setting} onChange={onChange as (value: number) => void} />;

      case "enum":
        if ((setting.enumValues && setting.enumValues.length > 0) || (setting.options && setting.options.length > 0)) {
          return <DropdownInput setting={setting} onChange={onChange as (value: string) => void} />;
        }
        return <TextInput setting={setting} onChange={onChange as (value: string) => void} />;

      case "array":
        return <ListInput setting={setting} onChange={onChange as (value: string[]) => void} />;

      case "string":
      default:
        return <TextInput setting={setting} onChange={onChange as (value: string) => void} />;
    }
  };

  return (
    <div className="setting-with-comments">
      {renderInput()}
      <CommentSection
        comments={setting.userComments}
        onAddComment={(text) => onAddComment(setting.key, text)}
        onDeleteComment={(commentId) => onDeleteComment(setting.key, commentId)}
      />
    </div>
  );
}

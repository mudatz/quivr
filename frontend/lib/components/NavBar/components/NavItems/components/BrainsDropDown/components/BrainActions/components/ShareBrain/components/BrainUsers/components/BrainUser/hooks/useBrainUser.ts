import axios, { AxiosResponse } from "axios";
import { useState } from "react";

import { useBrainApi } from "@/lib/api/brain/useBrainApi";
import { useBrainContext } from "@/lib/context/BrainProvider/hooks/useBrainContext";
import { useToast } from "@/lib/hooks";

import { BrainRoleType } from "../../../../../../../types";

type UseBrainUserProps = {
  fetchBrainUsers: () => Promise<void>;
  rights: BrainRoleType;
  brainId: string;
  email: string;
};
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useBrainUser = ({
  brainId,
  fetchBrainUsers,
  rights,
  email,
}: UseBrainUserProps) => {
  const { updateBrainAccess } = useBrainApi();
  const { publish } = useToast();
  const [selectedRole, setSelectedRole] = useState<BrainRoleType>(rights);
  const [isRemovingAccess, setIsRemovingAccess] = useState(false);
  const { currentBrain } = useBrainContext();
  const updateSelectedRole = async (newRole: BrainRoleType) => {
    setSelectedRole(newRole);
    try {
      await updateBrainAccess(brainId, email, {
        rights: newRole,
      });
      publish({ variant: "success", text: `Updated ${email} to ${newRole}` });
      void fetchBrainUsers();
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 403) {
        publish({
          variant: "danger",
          text: `${JSON.stringify(
            (
              e.response as {
                data: { detail: string };
              }
            ).data.detail
          )}`,
        });
      } else {
        publish({
          variant: "danger",
          text: `Failed to update ${email} to ${newRole}`,
        });
      }
    }
  };

  const removeUserAccess = async () => {
    setIsRemovingAccess(true);
    try {
      await updateBrainAccess(brainId, email, {
        rights: null,
      });
      publish({ variant: "success", text: `Removed ${email} from brain` });
      void fetchBrainUsers();
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.data !== undefined) {
        publish({
          variant: "danger",
          text: (
            e.response as AxiosResponse<{
              detail: string;
            }>
          ).data.detail,
        });
      } else {
        publish({
          variant: "danger",
          text: `Failed to remove ${email} from brain`,
        });
      }
    } finally {
      setIsRemovingAccess(false);
    }
  };
  const canRemoveAccess = currentBrain?.rights === "Owner";

  return {
    isRemovingAccess,
    removeUserAccess,
    updateSelectedRole,
    selectedRole,
    canRemoveAccess,
  };
};

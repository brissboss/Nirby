import { apiClient } from "./client";
import type { Client } from "./generated/client/types.gen";
import * as sdk from "./generated/sdk.gen";

type SdkOptions = { client?: Client };

/**
 * Binds a generated SDK function to {@link apiClient} (auth header + token refresh).
 *
 * Generic on purpose: an untyped wrapper would erase the request and response types of
 * every endpoint to `any`.
 */
function withDefaultClient<TOptions extends SdkOptions | undefined, TResult>(
  fn: (options: TOptions) => TResult
) {
  return (options?: TOptions) =>
    fn({ ...options, client: options?.client ?? apiClient } as TOptions);
}

export const signup = withDefaultClient(sdk.signup);
export const verifyEmail = withDefaultClient(sdk.verifyEmail);
export const resendVerification = withDefaultClient(sdk.resendVerification);
export const login = withDefaultClient(sdk.login);
export const refreshToken = withDefaultClient(sdk.refreshToken);
export const logout = withDefaultClient(sdk.logout);
export const forgotPassword = withDefaultClient(sdk.forgotPassword);
export const resetPassword = withDefaultClient(sdk.resetPassword);
export const changePassword = withDefaultClient(sdk.changePassword);
export const deleteAccount = withDefaultClient(sdk.deleteAccount);
export const getMe = withDefaultClient(sdk.getMe);
export const exportMe = withDefaultClient(sdk.exportMe);
export const updateMe = withDefaultClient(sdk.updateMe);
export const searchGooglePlaces = withDefaultClient(sdk.searchGooglePlaces);
export const getGooglePlacePhoto = withDefaultClient(sdk.getGooglePlacePhoto);
export const getGooglePlace = withDefaultClient(sdk.getGooglePlace);
export const getCollaborators = withDefaultClient(sdk.getCollaborators);
export const leaveList = withDefaultClient(sdk.leaveList);
export const removeCollaborator = withDefaultClient(sdk.removeCollaborator);
export const updateCollaboratorRole = withDefaultClient(sdk.updateCollaboratorRole);
export const inviteCollaborator = withDefaultClient(sdk.inviteCollaborator);
export const joinListByInvite = withDefaultClient(sdk.joinListByInvite);
export const addPoiToList = withDefaultClient(sdk.addPoiToList);
export const getPoiListMembership = withDefaultClient(sdk.getPoiListMembership);
export const getListPois = withDefaultClient(sdk.getListPois);
export const getNearbyListPois = withDefaultClient(sdk.getNearbyListPois);
export const removePoiFromList = withDefaultClient(sdk.removePoiFromList);
export const getLists = withDefaultClient(sdk.getLists);
export const createList = withDefaultClient(sdk.createList);
export const deleteList = withDefaultClient(sdk.deleteList);
export const getListById = withDefaultClient(sdk.getListById);
export const updateList = withDefaultClient(sdk.updateList);
export const unshareList = withDefaultClient(sdk.unshareList);
export const shareList = withDefaultClient(sdk.shareList);
export const revokeEditLink = withDefaultClient(sdk.revokeEditLink);
export const generateEditLink = withDefaultClient(sdk.generateEditLink);
export const joinListByEditLink = withDefaultClient(sdk.joinListByEditLink);
export const getPois = withDefaultClient(sdk.getPois);
export const createPoi = withDefaultClient(sdk.createPoi);
export const getNearbyPois = withDefaultClient(sdk.getNearbyPois);
export const deletePoi = withDefaultClient(sdk.deletePoi);
export const getPoiById = withDefaultClient(sdk.getPoiById);
export const updatePoi = withDefaultClient(sdk.updatePoi);
export const healthCheck = withDefaultClient(sdk.healthCheck);
export const readinessCheck = withDefaultClient(sdk.readinessCheck);
export const getSharedList = withDefaultClient(sdk.getSharedList);
export const getSharedListPois = withDefaultClient(sdk.getSharedListPois);
export const uploadAvatar = withDefaultClient(sdk.uploadAvatar);
export const uploadPoiPhoto = withDefaultClient(sdk.uploadPoiPhoto);

export type * from "./generated/types.gen";
export type { Options } from "./generated/sdk.gen";

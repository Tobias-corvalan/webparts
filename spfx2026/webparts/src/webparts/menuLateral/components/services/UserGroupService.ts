// services/UserGroupService.ts

export class UserGroupService {
  /**
   * @param webUrl url absoluta del web contra el que se chequea la membresía
   *                (normalmente siteAbsoluteUrl, igual que el código viejo)
   */
  constructor(private webUrl: string) {}

  /**
   * Equivalente a getGruposPertenecientes(): pega contra
   * /_api/web/currentuser/?$expand=groups y busca el Id de grupo indicado.
   */
  public async isUserInGroup(groupId: number): Promise<boolean> {
    try {
      const endpoint = `${this.webUrl.replace(/\/$/, '')}/_api/web/currentuser/?$expand=groups`;
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json;odata=verbose' },
      });

      if (!response.ok) {
        throw new Error(`No se pudo consultar los grupos del usuario: HTTP ${response.status}`);
      }

      const data = await response.json();
      const groups: { Id: number }[] = data?.d?.Groups?.results || [];
      return groups.some((g) => g.Id === groupId);
    } catch (err) {
      console.error('No se pudo chequear los grupos del usuario:', err);
      return false;
    }
  }
}
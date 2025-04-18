import { ActionList, Avatar, Banner, Box, Button, HorizontalStack, Icon, LegacyCard, Link, Page, Popover, ResourceItem, ResourceList, Text, Modal, TextField, VerticalStack, Checkbox } from "@shopify/polaris"
import { DeleteMajor, TickMinor, PasskeyMajor } from "@shopify/polaris-icons"
import { useEffect, useState, useRef } from "react";
import func from "@/util/func";
import settingRequests from "../api";
import ResourceListModal from "../../../components/shared/ResourceListModal";
import { usersCollectionRenderItem } from "../rbac/utils";
import PersistStore from "../../../../main/PersistStore";
import SearchableResourceList from "../../../components/shared/SearchableResourceList";
import OperatorDropdown from "../../../components/layouts/OperatorDropdown";

const rolesOptions = [
    {
        label: 'Admin',
        value: 'ADMIN',
    },
    {
        label: 'Security Engineer',
        value: 'MEMBER',
    },
    {
        label: 'Developer',
        value: 'DEVELOPER',
    },
    {
        label: 'Guest',
        value: 'GUEST',
    }]

const getRoleDisplayName = (role) => {
    for (let item of rolesOptions) {
        if (item.value === role) {
            return item.label;
        }
    }
    return role;
}

const Roles = () => {

    const userRole = window.USER_ROLE
    const isLocalDeploy = func.checkLocal();
    const [roles, setRoles] = useState([])
    const [tempRoles, setTempRoles] = useState([])
    const [allCollections, setAllCollections] = useState([])
    const [loading, setLoading] = useState(false)
    const collectionsMap = PersistStore(state => state.collectionsMap)
    const [createNewRoleModalActive, setCreateNewRoleModalActive] = useState(false)

    const toggleInviteUserModal = () => {
        setCreateNewRoleModalActive(!createNewRoleModalActive)
    }

    const getRoleData = async () => {
        setLoading(true);
        const roleResponse = await settingRequests.getCustomRoles()
        console.log(roleResponse);
        if (roleResponse.roles) {
            setRoles(roleResponse.roles)
            setTempRoles(roleResponse.roles)
        }
        setLoading(false)
    };

    useEffect(() => {
        if (userRole !== 'GUEST') {
            getRoleData();
        }
        setAllCollections(Object.entries(collectionsMap).map(([id, collectionName]) => ({
            id: parseInt(id, 10),
            collectionName
        })));
    }, [])

    const getRoleApiCollectionIds = (role) => {
        return roles.filter(r => r.name === role)[0].apiCollectionsId || []
    };

    const handleSelectedItemsChange = (role, items) => {
        setRoles(prevRoles => {
            return prevRoles.map(r => {
                if (r.name === role) {
                    return {
                        ...r,
                        apiCollectionsId: items
                    }
                }
                return r;
            })
        })
    }

    const updateBaseRole = (role, baseRole) => {
        setRoles(prevRoles => {
            return prevRoles.map(r => {
                if (r.name === role) {
                    return {
                        ...r,
                        baseRole: baseRole
                    }
                }
                return r;
            })
        })
    }

    const updateDefaultInviteRole = (role, value) => {
        setRoles(prevRoles => {
            return prevRoles.map(r => {
                if (r.name === role) {
                    return {
                        ...r,
                        defaultInviteRole: value
                    }
                }
                return r;
            })
        })
    }

    const handleUpdate = async (role) => {
        const roleData = roles.filter(r => r.name === role)[0]
        await settingRequests.updateCustomRole(roleData.apiCollectionsId, role, roleData.baseRole, roleData.defaultInviteRole)
        await getRoleData();
    }

    const handleClose = () => {
        setRoles(tempRoles)
    }

    const [newRoleName, setNewRoleName] = useState('')

    const handleNewRoleNameUpdate = (val) => {
        setNewRoleName(val)
    }

    const handleCreateNewRole = async () => {
        await settingRequests.createCustomRole([], newRoleName, "GUEST")
        setNewRoleName('')
        toggleInviteUserModal();
        await getRoleData();
    }

    return (
        <Page
            title="Custom roles"
            primaryAction={{
                content: 'Create new role',
                onAction: () => toggleInviteUserModal(),
                'disabled': (isLocalDeploy || userRole !== 'ADMIN')
            }}
            divider
        >
            <Modal
                open={createNewRoleModalActive}
                onClose={toggleInviteUserModal}
                title="Create new role"
                primaryAction={{
                    content: 'Create',
                    onAction: () => { handleCreateNewRole() },
                    'disabled': newRoleName.length === 0
                }}
                secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: toggleInviteUserModal
                    }
                ]}
            >
                <Box padding={8}>
                    <TextField onChange={val => handleNewRoleNameUpdate(val)} value={newRoleName} />
                </Box>
            </Modal>
            <LegacyCard>
                <ResourceList
                    resourceName={{ singular: 'role', plural: 'roles' }}
                    items={roles}
                    renderItem={(item) => {
                        const { name, baseRole, defaultInviteRole } = item;
                        const shortcutActions = [
                            {
                                content: (
                                    <ResourceListModal
                                        title={`Update ${name} role`}
                                        activatorPlaceaholder={`${(getRoleApiCollectionIds(name) || []).length} collections accessible, ${getRoleDisplayName(baseRole)} permissions${defaultInviteRole ? ', Default invite role' : ''}`}
                                        isColoredActivator={true}
                                        component={<VerticalStack gap={4}>
                                            <Box paddingBlockStart={4}>
                                                <HorizontalStack gap={6} align="center" blockAlign="center">
                                                    <OperatorDropdown
                                                        items={rolesOptions}
                                                        label={getRoleDisplayName(baseRole)}
                                                        designer={true}
                                                        selected={(value) => {
                                                            updateBaseRole(name, value)
                                                        }}
                                                    />
                                                    <Checkbox
                                                        label={"Default invite role"}
                                                        checked={defaultInviteRole}
                                                        onChange={(checked) => { updateDefaultInviteRole(name, checked) }}
                                                    />
                                                </HorizontalStack>
                                            </Box>
                                            <Box>
                                                <SearchableResourceList
                                                    resourceName={'collection'}
                                                    items={allCollections}
                                                    renderItem={usersCollectionRenderItem}
                                                    isFilterControlEnabale={userRole === 'ADMIN'}
                                                    selectable={userRole === 'ADMIN'}
                                                    onSelectedItemsChange={(items) => handleSelectedItemsChange(name, items)}
                                                    alreadySelectedItems={getRoleApiCollectionIds(name)}
                                                />
                                            </Box>
                                        </VerticalStack>}
                                        primaryAction={() => { handleUpdate(name) }}
                                        secondaryAction={() => { handleClose() }}
                                        showDeleteAction={true}
                                        deleteAction={async () => { await settingRequests.deleteCustomRole(name); await getRoleData() }}
                                    />

                                )
                            }
                        ]

                        return (
                            <ResourceItem
                                id={name}
                                shortcutActions={shortcutActions}
                                persistActions
                            >
                                <Text variant="bodyMd" fontWeight="bold" as="h3">
                                    {name}
                                </Text>
                            </ResourceItem>
                        );
                    }}
                    headerContent={`Showing ${roles.length} role${roles.length > 1 ? 's' : ''}`}
                    showHeader
                    loading={loading}
                />
            </LegacyCard>

        </Page>
    )
}

export default Roles;
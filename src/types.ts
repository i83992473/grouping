export type Item = {
  id: string
  title: string
  description: string
}

export type Group = {
  id: string
  name: string
  parentGroupId: string | null
}

export type Membership = {
  itemId: string
  groupId: string
}

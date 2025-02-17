import { Group, Loader } from "@mantine/core";

export default function Loading() {
  return (
    <Group h="100vh" w="100vw" justify="center" align="center">
      <Loader size="xl" type="bars"/>
    </Group>
  )
}
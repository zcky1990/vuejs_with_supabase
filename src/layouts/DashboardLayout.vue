<script setup lang="ts">
</script>

<template>
    <div class="flex flex-col items-center justify-center w-full">
        <div class="flex flex-col items-center justify-center w-full fixed top-0 z-50">
            <AppAlert />
        </div>
        <div class="fixed top-4 right-4 z-50">
            <ThemeSwitcher />
        </div>
        <div>
            <slot />
        </div>
    </div>
</template>
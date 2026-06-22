<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ref } from 'vue'

interface LoginProps {
  class?: HTMLAttributes["class"],
  title?: string,
  description?: string,
  onSubmit: (email: string, password: string) => void,
}

const props = withDefaults(defineProps<LoginProps>(), {
  title: 'Login to your account',
  description: 'Enter your email below to login to your account',
})

const handleSubmit = () => {
  props.onSubmit(email.value, password.value)
}

const email = ref('')
const password = ref('')

</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <Card>
      <CardHeader>
        <CardTitle>{{ props.title }}</CardTitle>
        <CardDescription>
          {{ props.description }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit">
          <FieldGroup>
            <Field>
              <FieldLabel for="email">
                Email
              </FieldLabel>
              <Input
                id="email"
                type="email"
                v-model="email"
                placeholder="m@example.com"
                required
              />
            </Field>
            <Field>
              <div class="flex items-center">
                <FieldLabel for="password">
                  Password
                </FieldLabel>
                <a
                  href="#"
                  class="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input id="password" type="password" v-model="password" required />
            </Field>
            <Field>
              <Button type="submit">
                Login
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

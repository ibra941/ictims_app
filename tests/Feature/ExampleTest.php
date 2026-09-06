<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_the_landing_page_loads_with_auth_links(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('Log in');
    }

    public function test_the_dashboard_redirects_guests_to_login(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirect('/login');
    }
}
